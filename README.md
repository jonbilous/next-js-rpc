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

const [handler, getLocations] = createHandler({
  url: "/api/functions",
  fn: async (params, ctx) => {
    return db.location.findMany();
  },
  schema,
  ctx,
});

export type LocationQuery = typeof handler;

export { getLocations };
export default handler;
```

## Next.JS Page

```js
import { useUser } from "@auth0/nextjs-auth0";
import { client } from "@jonbilous/next-js-rpc";
import type { GetServerSideProps, NextPage } from "next";
import type { LocationQuery } from "pages/api/functions";
import { getLocations } from "pages/api/functions";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const locations = await getLocations(null, ctx);
  // import getLocations directly on the server

  return { props: { locations } };
};

const Home: NextPage = (props) => {
  const user = useUser();

  const query = client.useQuery < LocationQuery > ("/api/functions", null);
  // type provides url, request, and response types

  return <div></div>;
};

export default Home;
```
