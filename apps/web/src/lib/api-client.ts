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

async function readJsonResponse<Data>(response: Response, fallbackMessage: string): Promise<Data> {
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : fallbackMessage;
    throw new ApiClientError(response.status, message);
  }
  return response.json() as Promise<Data>;
}

/** GETs a JSON resource from the REST API and throws ApiClientError on non-2xx responses. */
export async function fetchJson<Data>(url: string): Promise<Data> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  return readJsonResponse<Data>(response, "No fue posible cargar la información");
}

/** POSTs a JSON body to the REST API and throws ApiClientError on non-2xx responses. */
export async function postJson<Data>(url: string, body: unknown): Promise<Data> {
  const response = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readJsonResponse<Data>(response, "No fue posible enviar la información");
}
