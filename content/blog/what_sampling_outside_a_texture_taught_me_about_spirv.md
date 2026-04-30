---
title: "What Sampling Outside a Texture Taught Me About SPIR-V"
abstract: "Vulkan sampler border colors hide a surprising number of pitfalls. Here's how I used SPIR-V shader reflection to avoid them entirely."
tags: ["c++", "graphics", "vulkan"]
date: 2026-04-28
lastModified: 2026-04-29
---

## Background
Using the CLAMP_TO_BORDER addressing mode, texture samplers can be configured to return a solid border color when sampled outside of the image boundaries.
Vulkan exposes a set of predefined border color constants:
```cpp
typedef enum [[class-name,VkBorderColor]] {
    [[enum-value,VK_BORDER_COLOR_FLOAT_TRANSPARENT_BLACK]],  // (0.0f, 0.0f, 0.0f, 0.0f)
    [[enum-value,VK_BORDER_COLOR_INT_TRANSPARENT_BLACK]],    // (0, 0, 0, 0)
    [[enum-value,VK_BORDER_COLOR_FLOAT_OPAQUE_BLACK]],       // (0.0f, 0.0f, 0.0f, 1.0f)
    [[enum-value,VK_BORDER_COLOR_INT_OPAQUE_BLACK]],         // (0, 0, 0, 1)
    [[enum-value,VK_BORDER_COLOR_FLOAT_OPAQUE_WHITE]],       // (1.0f, 1.0f, 1.0f, 1.0f)
    [[enum-value,VK_BORDER_COLOR_INT_OPAQUE_WHITE]],         // (1, 1, 1, 1)

    // Provided by VK_EXT_custom_border_color
    [[enum-value,VK_BORDER_COLOR_FLOAT_CUSTOM_EXT]],
    [[enum-value,VK_BORDER_COLOR_INT_CUSTOM_EXT]],
} [[class-name,VkBorderColor]];
```

`VkBorderColor` contains INT and FLOAT variants because the border color type of the sampler must match the format of the image being sampled.
Using an INT color variant with a RGBA8_UNORM texture, for example, is invalid and will result in validation errors.

[`VK_EXT_custom_border_color`](https://registry.khronos.org/VulkanSC/specs/1.0-extensions/man/html/VK_EXT_custom_border_color.html) extends this with two additional variants, `VK_BORDER_COLOR_FLOAT_CUSTOM_EXT` and `VK_BORDER_COLOR_INT_CUSTOM_EXT`, and exposes [`VkSamplerCustomBorderColorCreateInfoEXT`](https://registry.khronos.org/VulkanSC/specs/1.0-extensions/man/html/VkSamplerCustomBorderColorCreateInfoEXT.html) to chain into `pNext` of [`VkSamplerCreateInfo`](https://registry.khronos.org/VulkanSC/specs/1.0-extensions/man/html/VkSamplerCreateInfo.html) during sampler creation.
This struct accepts a `VkClearColorValue` for the `customBorderColor` member, meaning both color and depth/stencil formats are supported.
This is more than just a convenience: **predefined border color constants have no specified behavior for depth formats**.
In fact, some driver implementations have been reported to (silently) return 0 at the border regardless of the border color variant being used.
I'm not sure if this is a bug in the spec or undocumented (but intended) behavior ([#1681](https://github.com/KhronosGroup/Vulkan-Docs/issues/1681)).
Either way, custom border colors are simply **required** for correct border sampling of depth/stencil images.

When creating a sampler for depth/stencil images, setting `borderColor` to `VK_BORDER_COLOR_FLOAT_CUSTOM_EXT` targets the depth aspect, while `VK_BORDER_COLOR_INT_CUSTOM_EXT` targets the stencil aspect.
Note that a combined depth/stencil attachment may require separate samplers, depending on which aspect is being sampled.

The extension also requires that the format of the sampled image is specified explicitly, giving the driver the information it needs to correctly interpret the `customBorderColor`.
With predefined constants, the INT/FLOAT variant encodes enough information for validation layers to catch mismatches.
With custom border colors, the implementation can only validate that the sampler and image were created with compatible formats (a weaker guarantee, but better than nothing).
The `customBorderColorWithoutFormat` feature removes even this, skipping any validation entirely and turning any format mismatch into silent data corruption.
In my experience, this makes it of limited practical use.

These pitfalls are Vulkan-specific bookkeeping concerns that a higher-level abstraction can eliminate.
Ideally, the user should simply be able to specify a border color value and have the correct `VkBorderColor` and `VkClearColorValue` (if necessary) derived from the image format automatically.

## How do I fix it?

Resolving this at a higher level requires knowing which image format(s) a sampler is used with.
This information, however, is not always readily available.
Modern graphics APIs separate the sampler from the texture, allowing each to be bound as a standalone resource.
This model is a lot more flexible, as it enables a single sampler to be reused across many textures (or vice versa).
This is a step away from the legacy combined image samplers used by OpenGL (`sampler2D` in GLSL), which bundles the two together into a single resource and makes the sampler-image relationship explicit at the descriptor level.

In Vulkan GLSL, standalone `sampler` and `texture2D` resources are combined at the call site into a `sampler2D`:
```glsl
layout(set = 0, binding = 0) uniform sampler my_sampler;
layout(set = 0, binding = 1) uniform texture2D my_texture;

void main() {
    vec4 color = texture(sampler2D(my_texture, my_sampler), uv);
    // ...
}
```
HLSL exposes the same concept through `SamplerState` and `Texture2D`:
```hlsl
SamplerState my_sampler : register(s0);
Texture2D my_texture : register(t1);

float4 main() : SV_Target {
    return my_texture.Sample(my_sampler, uv);
}
```
With separate resources, the relationship between samplers and the images they are paired with only exists in the shader code.
Reflection libraries such as SPIRV-Reflect expose only enough information to generate descriptor set layouts (binding points, descriptor types, push constants, etc.) but do not capture how the resources are used.
Recovering sampler-image pairings requires bypassing the reflection API and looking at the SPIR-V directly.

## Parsing SPIR-V

SPIR-V is a binary intermediate representation, closer to assembly than to a high-level shading language.
Like assembly, it operates on a flat stream of instructions, where each value is assigned a unique ID that subsequent instructions reference.
There are no variable or function names.
A `sampler2D` instruction in GLSL, for example, compiles down to a series of load, combine, and sample instructions that operate using IDs.

### The header
A SPIR-V module begins with a five-word header (https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#PhysicalLayout):  
| Word | Representation |
| ----------- | ----------- |
| 0   | Magic number (0x07230203) |
| 1   | Version number |
| 2   | Generator's magic number (tool that generated the module) |
| 3   | ID bound (highest ID used in the module + 1) |
| 4   | Reserved |

The magic number is primarily to validate that we're processing a valid SPIR-V module.

### The instruction stream
Everything after the 5th word is the instruction stream for the shader module, with each instruction encoded as one or more 32-bit words.
The first word of every instruction packs two fields: the length of the instruction (stored in the high 16 bits) and the instruction opcode (stored in the low 16 bits).
Any remaining words are operands, laid out in a fixed order defined by the opcode (https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#Instructions).
```
word 0:  [ instruction length (16) | opcode (16) ]
word 1:  operand
word 2:  operand
...
```
Much like reading disassembled machine code, recovering high-level information requires tracing back through the instruction stream.
A sampler variable doesn't carry its binding location with it; that metadata lives in a separate `OpDecorate` instruction elsewhere in the module.
The pairing between a sampler and an image only appears at the point of use in an `OpSampledImage` instruction.
This is why using the reflection API alone isn't enough - the declarations tell you what resources exist, but not how they relate to each other.

Recovering the sampler-image relationship requires tracing a chain of three instruction types:
 - [`OpDecorate`](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#OpDecorate) attaches additional information to IDs.
This includes binding location, descriptor set index, interpolation qualifiers, and memory layout hints.
Each qualifier in a GLSL `layout(...)` block compiles to a separate `OpDecorate` instruction.
 - [`OpLoad`](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#OpLoad) loads a variable into a new ID.
This is analogous to loading a value from memory into a register, and is how shader resources go from being variables to usable values in the instruction stream.
 - [`OpSampledImage`](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#OpSampledImage) combines an image ID and a sampler ID into a single sampled image handle.
This instruction is emitted at every point in the shader where a texture sample occurs.

`OpSampledImage` is the most important instruction, as this is where the sampler-image relationship is made explicit.

Using a single pass over the instruction stream, we visit each `OpDecorate`, `OpLoad`, and `OpSampledImage` instruction to collect the relevant information: the binding location of each variable, which variable each load result came from, and which image and sampler loads are paired together.
```cpp
std::unordered_map<std::uint32_t, BindingLocation> variable_to_binding_location;
std::unordered_map<std::uint32_t, std::uint32_t> load_to_variable;
std::unordered_map<std::uint32_t, std::uint32_t> sampler_load_to_image_load;

// Start at the 5th word to skip the header
for (std::uint32_t i = 5; i < word_count;) {
    std::uint32_t word = spir_v[i];
    std::uint32_t length = word >> SpvWordCountShift;  // 16
    std::uint32_t opcode = word & SpvOpCodeMask;  // 0xFFFF

    if (length == 0 || i + length > word_count) {
        // Reached the end of the instruction stream
        break;
    }

    switch (opcode) {
        case SpvOpDecorate: {
            // [1] = variable (ID), [2] = decoration, [3] = value(s) (optional)
            std::uint32_t variable = spir_v[i + 1];
            std::uint32_t decoration = spir_v[i + 2];

            if (decoration == SpvDecorationBinding) {
                // layout(binding = X)
                variable_to_binding_location[variable].binding = spir_v[i + 3];
            }
            else if (decoration == SpvDecorationDescriptorSet) {
                // layout(set = X)
                variable_to_binding_location[variable].set = spir_v[i + 3];
            }
            break;
        }

        case SpvOpLoad: {
            // [1] = result type (ID), [2] = result (ID), [3] = variable (ID)
            std::uint32_t result = spir_v[i + 2];
            std::uint32_t variable = spir_v[i + 3];
            load_to_variable[result] = variable;
            break;
        }

        case SpvOpSampledImage: {
            // [1] = result type (ID), [2] = result (ID), [3] = image (ID), [4] = sampler (ID)
            std::uint32_t image = spir_v[i + 3];
            std::uint32_t sampler = spir_v[i + 4];

            // Check the sampler map and add the image binding if it hasn't been encountered before
            // ... 
            sampler_load_to_image_load[sampler].push_back(image);
            break;
        }
    }

    // Step to the next instruction
    i += length;
}
```

## Integration
Once the instruction stream has been parsed, each sampler-image pairing is traced back through the load results to their original variables.
From there, the variables are used to create a mapping from sampler binding locations to the image binding locations they are used with.
```cpp
std::unordered_map<BindingLocation, std::vector<BindingLocation>> sampler_to_images;

for (const auto& [sampler_load, image_loads] : sampler_load_to_image_loads) {
    std::uint32_t sampler_variable = load_to_variable[sampler_load];
    const BindingLocation& sampler_location = variable_to_binding_location[sampler_variable];
    
    std::vector<BindingLocation>& image_locations = sampler_to_images[sampler_location];
    for (std::uint32_t image_load : image_loads) {
        std::uint32_t image_variable = load_to_variable[image_load];
        const BindingLocation& image_location = variable_to_binding_location[image_variable];
        
        image_locations.emplace_back(image_location);
    }
}
```

At frame compilation time, the render graph resolves which resources are bound to which descriptor slots.
Samplers are instantiated lazily, using the `sampler_to_images` map to determine what format the border color should use.
This is also a good opportunity to catch errors early: if the same sampler is used with images of incompatible formats, this can be surfaced here rather than manifesting as corrupted rendering later.

This also means that the sampler format can be determined internally, without exposing it as a user-facing parameter.
In a graphics API-agnostic renderer (or one that doesn't use Vulkan), requiring such a parameter wouldn't make much sense anyway.

This makes configuring samplers from the user's perspective much nicer:
```cpp
struct SamplerDescription {
    FilterMode min_filter = FilterMode::Linear;
    FilterMode mag_filter = FilterMode::Linear;

    MipMode mip_mode = MipMode::Linear;

    AddressMode address_mode_u = AddressMode::Repeat;
    AddressMode address_mode_v = AddressMode::Repeat;
    AddressMode address_mode_w = AddressMode::Repeat;
    
    ClearValue border_color = Color(0.0f, 0.0f, 0.0f);
    // No format!

    float min_lod = 0.0f;
    float max_lod = std::numeric_limits<float>::max();
    
    std::uint32_t max_anisotropy_sample_count = 0;
    std::optional<CompareOp> depth_compare_op;  // For depth samplers
};
```
The correct `VkBorderColor` variant and `VkClearColorValue` member are derived automatically from the image format during sampler initialization, with `VK_EXT_custom_border_color` used unconditionally to sidestep the predefined constant pitfalls for depth/stencil images described earlier.

The best part?
Any renderer that already compiles shader modules to SPIR-V basically gets this for free.
