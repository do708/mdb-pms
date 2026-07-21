from pathlib import Path

from core.manifest_loader import ManifestLoader


class Generator:

    def __init__(
        self,
        root: Path
    ):

        self.root = root

        self.manifest = ManifestLoader(
            root / "manifest.yaml"
        ).load()