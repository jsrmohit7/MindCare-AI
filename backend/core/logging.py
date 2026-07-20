import logging
import sys
from typing import Any


class RequestIdFilter(logging.Filter):
    """
    A logging filter that injects a default request_id ("N/A") into log records
    if it is not already explicitly provided in the log extra context.
    """
    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "request_id"):
            record.request_id = "N/A"
        return True


def setup_logging() -> None:
    """
    Sets up the global application logging with a structured format and a Request ID filter.
    """
    root_logger = logging.getLogger()
    
    # Clean up existing handlers to avoid double logging
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(RequestIdFilter())
    
    # structured logging format: timestamp level logger_name request_id message
    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(name)s [ReqID: %(request_id)s] - %(message)s"
    )
    handler.setFormatter(formatter)
    
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)


# Obtain a standard logger for the application
logger = logging.getLogger("mindcare_ai")
