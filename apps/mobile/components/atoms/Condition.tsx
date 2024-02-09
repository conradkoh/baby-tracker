export const Conditional = (props: {
  render: boolean;
  children?: React.ReactNode;
}) => {
  if (props.render) {
    return <>{props.children}</>;
  }
  return <></>;
};
