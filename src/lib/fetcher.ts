export const fetcher = async <Result>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Result> => {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<Result>;
};
