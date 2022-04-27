import type { GetServerSideProps } from "next";
import superjson from "superjson";

const ssrProvider = <T>(
  getServerSideProps: GetServerSideProps<T>
): GetServerSideProps<T> => {
  return async (ctx) => {
    const res = await getServerSideProps(ctx);

    const props = { ...(res as any).props };

    Object.entries(props).forEach(([key, value]: [string, any]) => {
      if (value.json && value.meta) {
        props[key] = superjson.serialize(value);
      }
    });

    return { props, ...res };
  };
};

export default ssrProvider;
