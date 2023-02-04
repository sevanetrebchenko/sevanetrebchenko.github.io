// https://prismjs.com/tokens.html

var theme = {
  plain: {
    color: 'rgb(169, 183, 198)',
    backgroundColor: 'rgb(43, 43, 43)',
    fontFamily: "JetBrains Mono"
  },
  styles: [
    {
      types: ['function'],
      style: {
        color: 'rgb(255, 198, 109)'
      }
    },
    {
      types: ['comment'],
      style: {
        color: 'rgb(128, 128, 128)'
      }
    },     
    {
      types: ['directive', 'directive-hash', 'macro-name'],
      style: {
        color: 'rgb(207, 201, 31)'
      }
    },
    {
      types: ['keyword', 'boolean'],
      style: {
        color: 'rgb(204, 120, 50)'
      }
    },
    {
      types: ['class-name', 'builtin'],
      style: {
        color: '#e2777a'
        // color: 'rgb(185, 188, 209)'
      }
    },
    {
      types: ['number'],
      style: {
        color: 'rgb(104, 151, 187)'
      }
    }, 
    {
      types: ['constant'],
      style: {
        color: 'rgb(152, 118, 170)'
      }
    }, 
    {
      types: ['char', 'string'],
      style: {
        color: 'rgb(106, 135, 89)'
      }
    },
  ]
};

export default theme;
