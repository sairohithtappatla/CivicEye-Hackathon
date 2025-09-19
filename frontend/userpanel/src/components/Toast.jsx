function Toast({ message }) {
  if (!message) return null;
  return <div className="gov-toast">{message}</div>;
}
export default Toast;
