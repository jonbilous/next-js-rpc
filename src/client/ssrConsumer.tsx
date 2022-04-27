import React from "react";
import superjson from "superjson";

const ssrConsumer = <T extends {}>(Component: React.FC<T>): React.FC<T> => {
  return (props) => {
    const parsedProps = superjson.deserialize<T>(props as any);

    return <Component {...parsedProps} />;
  };
};

export default ssrConsumer;
