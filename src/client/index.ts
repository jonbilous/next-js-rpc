import { useQuery, useMutation } from "react-query";

const fetcher = <Request, Response>(
  url: string,
  request: Request
): Promise<Response> => {
  return fetch(url, {
    body: JSON.stringify(request),
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).then((res) => res.json());
};

const useApiQuery = <Request, Response>(url: string, request: Request) => {
  return useQuery([url, request], () => {
    return fetcher<Request, Response>(url, request);
  });
};

const useApiMutation = <Request, Response>(url: string) => {
  return useMutation((request: Request) => {
    return fetcher<Request, Response>(url, request);
  });
};

export { useApiQuery as useQuery, useApiMutation as useMutation, fetcher };
