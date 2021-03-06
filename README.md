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
import { createHandler } from "@jonbilous/next-js-rpc/";
import { getUserSession } from "utils/ctx";
import db from "utils/db";
import zod from "zod";

const ctx = {
  user: getUserSession,
};

const schema = zod.null();

const getLocations = createHandler({
  url: "/api/functions",
  fn: async (params, ctx) => {
    return db.location.findMany();
  },
  schema,
  ctx,
});

export type LocationQuery = typeof getLocations;

export default getLocations;
```

## Next.JS Page

```js
import { client } from "@jonbilous/next-js-rpc";
import type { GetServerSideProps, NextPage } from "next";
import type { LocationQuery } from "pages/api/functions";
import getLocations from "pages/api/functions";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const locations = await getLocations.ssr(null, ctx);
  // import handler and call .ssr() to use on the server
  return { props: { locations } };
};

const Home: NextPage = (props) => {
  const query = client.useQuery < LocationQuery > ("/api/functions", null);
  // import type on the client and pass to useQuery - url, request type and response types will be inferred
  return <div></div>;
};

export default Home;
```
