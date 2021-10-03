
export default function Content(props = {}) {
  const { type, data } = props;

  switch (type ? type.toLowerCase() : null) {
    case 'text':
      return <p>{data}</p>;
    case 'image':
      // TODO
      break;
    default:
      return <p/>;
  }
}