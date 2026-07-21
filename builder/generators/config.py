from generators.base.template_generator import TemplateGenerator


class ConfigGenerator(TemplateGenerator):

    def generate(self):

        files = [
            (
                "config/package.json.j2",
                self.root.parent / "app" / "package.json",
                {
                    "project": self.manifest["project"]
                }
            ),
            (
                "config/tsconfig.json.j2",
                self.root.parent / "app" / "tsconfig.json",
                {}
            ),
            (
                "config/next.config.ts.j2",
                self.root.parent / "app" / "next.config.ts",
                {}
            ),
        ]

        for template, destination, context in files:

            self.render(
                template,
                destination,
                **context
            )

            print(f"✓ {destination.name}")