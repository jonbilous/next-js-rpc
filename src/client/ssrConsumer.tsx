import React from "react";
import superjson from "superjson";

const ssrConsumer = <T extends Record<string, unknown>>(
  Component: React.FC<T>
): React.FC<T> => {
  return (props) => {
    const parsedProps = { ...props };

    Object.entries(props).forEach(([key, value]: [string, any]) => {
      if (value.json && value.meta) {
        parsedProps[key as keyof T] = superjson.deserialize(value);
      }
    });

    return <Component {...parsedProps} />;
  };
};

export default ssrConsumer;
