import { useMutation, useQuery } from "react-query";
import { InferRequest, InferResponse, InferUrl } from "../types";
import superjson from "superjson";

const fetcher = async <T>(
  url: InferUrl<T>,
  request: InferRequest<T>
): Promise<InferResponse<T>> => {
  const response = await fetch(String(url), {
    body: JSON.stringify(request),
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const body = await response
    .json()
    .then((json) => superjson.deserialize(json));

  if (response.status !== 200) {
    throw new Error(body);
  }

  return body;
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

export { useApiQuery as useQuery, useApiMutation as useMutation, fetcher };
