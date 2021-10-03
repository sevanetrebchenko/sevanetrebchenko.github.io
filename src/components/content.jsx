
export default function Content(props = {}) {
  const { type } = props;

  if (type === "text") {
    // Text.
    const { data } = props;
    return <p>{data}</p>;
  }
  else if (type === "image") {
    // Image.
    const { data, alt } = props;
    var file = "./images/" + data;
    console.log(file);
    
    return <img src={file} alt={alt} />
  }
  else {
    console.log("Unknown file parameter '%s'", type);
    return <p />;
  }
}