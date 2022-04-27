import { useMutation, useQuery } from "react-query";
import { InferRequest, InferResponse, InferUrl } from "../types";
import superjson from "superjson";
import ssrConsumer from "./ssrConsumer";

const fetcher = <T>(
  url: InferUrl<T>,
  request: InferRequest<T>
): Promise<InferResponse<T>> => {
  return fetch(String(url), {
    body: JSON.stringify(request),
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((json) => superjson.deserialize(json));
};

const useApiQuery = <T>(url: InferUrl<T>, request: InferRequest<T>) => {
  return useQuery([url, request], () => {
    return fetcher<T>(url, request);
  });
};

const useApiMutation = <T>(url: InferUrl<T>) => {
  return useMutation((request: InferRequest<T>) => {
    return fetcher(url, request);
  });
};

export {
  useApiQuery as useQuery,
  useApiMutation as useMutation,
  fetcher,
  ssrConsumer,
};
