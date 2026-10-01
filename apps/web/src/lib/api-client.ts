/** Error thrown by the browser API client; carries the REST status and message. */
export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/** GETs a JSON resource from the REST API and throws ApiClientError on non-2xx responses. */
export async function fetchJson<Data>(url: string): Promise<Data> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : "No fue posible cargar la información";
    throw new ApiClientError(response.status, message);
  }
  return response.json() as Promise<Data>;
}
