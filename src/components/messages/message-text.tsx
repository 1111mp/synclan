type Props = {
  message: TextMessage;
};

function TextMessage({ message }: Props) {
  return <p className='select-text'>{message.content}</p>;
}

export { TextMessage };
