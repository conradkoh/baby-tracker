export const Conditional = (props: {
  render: boolean;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  if (props.render) {
    return <>{props.children}</>;
  } else {
    if (props.fallback) {
      return props.fallback;
    }
  }
  return <></>;
};
