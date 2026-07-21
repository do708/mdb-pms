from pathlib import Path
import yaml


class ManifestLoader:

    def __init__(self, path: Path):
        self.path = path

    def load(self) -> dict:
        if not self.path.exists():
            raise FileNotFoundError(
                f"Manifest not found: {self.path}"
            )

        with open(
            self.path,
            "r",
            encoding="utf-8"
        ) as file:
            return yaml.safe_load(file) or {}