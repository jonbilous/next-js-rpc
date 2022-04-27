import React from "react";
import superjson from "superjson";

const ssrConsumer = <T extends Record<string, unknown>>(
  Component: React.FC<T>
): React.FC<T> => {
  return (props) => {
    Object.entries(props).forEach(([key, value]: [string, any]) => {
      if (value.json && value.meta) {
        props[key as keyof T] = superjson.deserialize(value);
      }
    });

    return <Component {...props} />;
  };
};

export default ssrConsumer;
