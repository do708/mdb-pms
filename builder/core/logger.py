from datetime import datetime
from pathlib import Path


class Logger:

    def __init__(
        self,
        path: Path
    ):

        self.path = path

    def write(
        self,
        message: str
    ):

        self.path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        timestamp = datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )

        with open(
            self.path,
            "a",
            encoding="utf-8"
        ) as file:

            file.write(
                f"[{timestamp}] {message}\n"
            )