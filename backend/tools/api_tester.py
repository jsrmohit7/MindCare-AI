"""
Simple OpenAPI-driven tester: fetches /openapi.json and exercises each operation with best-effort sample data.
Generates a CSV-like report to stdout and saves detailed JSON to `api_test_report.json`.

Limitations: complex authentication, file uploads, and advanced parameter formats may not be exercised correctly.
"""
import json
import sys
import time
from pathlib import Path
from typing import Any

import requests

BASE = "http://127.0.0.1:8000"
TIMEOUT = 10

REPORT = {
    "base": BASE,
    "timestamp": time.time(),
    "results": [],
}


def sample_for_schema(schema: dict) -> Any:
    if not schema:
        return {}
    t = schema.get("type")
    if t == "string":
        return schema.get("example") or schema.get("default") or "test"
    if t == "integer":
        return schema.get("example") or schema.get("default") or 1
    if t == "number":
        return schema.get("example") or schema.get("default") or 1.0
    if t == "boolean":
        return schema.get("example") or schema.get("default") or False
    if t == "array":
        items = schema.get("items") or {}
        return [sample_for_schema(items)]
    if t == "object" or schema.get("properties"):
        out = {}
        props = schema.get("properties") or {}
        for k, v in props.items():
            out[k] = sample_for_schema(v)
        return out
    # fallback
    return {}


def main():
    try:
        r = requests.get(BASE + "/openapi.json", timeout=TIMEOUT)
        r.raise_for_status()
    except Exception as e:
        print("Failed to fetch OpenAPI spec:", e)
        sys.exit(1)

    spec = r.json()
    paths = spec.get("paths", {})

    for path, methods in paths.items():
        for method, op in methods.items():
            url = BASE + path
            summary = op.get("summary") or op.get("operationId") or ""
            # handle path params
            params = {}
            body = None
            query = {}
            headers = {"accept": "application/json"}

            # parameters
            for p in op.get("parameters", []):
                name = p.get("name")
                location = p.get("in")
                schema = p.get("schema") or {}
                sample = sample_for_schema(schema)
                if location == "path":
                    url = url.replace("{" + name + "}", str(sample))
                elif location == "query":
                    query[name] = sample
                elif location == "header":
                    headers[name] = sample

            # requestBody
            if op.get("requestBody"):
                content = op["requestBody"].get("content", {})
                if "application/json" in content:
                    schema = content["application/json"].get("schema", {})
                    body = sample_for_schema(schema)
                    headers["Content-Type"] = "application/json"
                else:
                    # skip other content types for now
                    body = None

            result = {"path": path, "method": method.upper(), "summary": summary, "url": url}
            try:
                resp = requests.request(method, url, params=query or None, json=body, headers=headers, timeout=TIMEOUT)
                try:
                    data = resp.json()
                except Exception:
                    data = resp.text[:400]
                result.update({"status_code": resp.status_code, "ok": resp.ok, "response": data})
                print(f"{method.upper()} {path} -> {resp.status_code}")
            except Exception as e:
                result.update({"error": str(e)})
                print(f"{method.upper()} {path} -> ERROR: {e}")

            REPORT["results"].append(result)

    outp = Path(__file__).resolve().parent / "api_test_report.json"
    outp.write_text(json.dumps(REPORT, indent=2))
    print("Wrote report to", outp)


if __name__ == "__main__":
    main()
