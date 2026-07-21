from pathlib import Path


class Validator:

    def exists(
        self,
        path: Path
    ) -> bool:

        return path.exists()

    def require(
        self,
        path: Path
    ):

        if not path.exists():
            raise Exception(
                f"Required file missing: {path}"
            )