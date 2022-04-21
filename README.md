# next-js-rpc

- Quickly create type-safe RPC endpoints for Next.JS
- Request validation with Zod
- Client side fetching with React Query

## Install

```bash
npm i zod react-query @jonbilous/next-js-rpc
```

## Next.JS API

```js
import type { NextApiRequest } from "next";
import {
  createHandler,
  InferRequest,
  InferResponse,
  InferSchema,
} from "@jonbilous/next-js-rpc/";
import zod from "zod";

const schema = zod.object({ world: zod.string() });

export const hello = async (
  data: InferSchema<typeof schema>,
  req?: NextApiRequest
) => {
  return "Hello " + data.world;
};

const handler = createHandler(hello, schema);

export type HelloRequest = InferRequest<typeof handler>;
export type HelloResponse = InferResponse<typeof handler>;

export default handler;
```

## Next.JS Page

```js
import { Button } from "@chakra-ui/react";
import { useMutation } from "@jonbilous/next-js-rpc/";
import type { HelloRequest, HelloResponse, hello } from "pages/api/functions";
import type { GetServerSideProps, NextPage } from "next";

export const getServerSideProps: GetServerSideProps = async (req) => {
  const res = await hello({ world: "world" });

  return { props: res };
};

const Home: NextPage<ServerProps> = (props) => {
  const products = useMutation<GetProductsRequest, GetProductsResponse>(
    "/api/functions/"
  );

  return (
    <Button
      onClick={() => {
        products
          .mutateAsync({ hello: "world" })
          .then((res) => toast({ title: JSON.stringify(res) }));
      }}
    >
      Mutate
    </Button>
  );
};

export default Home;

```
