from core.generator import Generator


class StructureGenerator(Generator):

    def generate(self):

        folders = [

            "app",
            "app/src",
            "app/src/app",
            "app/src/components",
            "app/src/features",
            "app/src/lib",
            "app/src/hooks",
            "app/src/types",
            "app/prisma",
            "app/public",

        ]

        for folder in folders:

            path = self.root.parent / folder

            path.mkdir(
                parents=True,
                exist_ok=True
            )

            print(f"✓ {folder}")