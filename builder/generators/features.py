from generators.base.template_generator import TemplateGenerator


class FeaturesGenerator(TemplateGenerator):

    def generate(self):

        modules = [

            "customers",
            "projects",
            "planning",
            "workorders",
            "materials",
            "documents",
            "reports",
            "users",

        ]


        files = [

            "components",
            "hooks",
            "services",
            "types",
            "validation",

        ]


        for module in modules:

            for folder in files:

                path = (
                    self.root.parent
                    / "app"
                    / "src"
                    / "features"
                    / module
                    / folder
                )

                path.mkdir(
                    parents=True,
                    exist_ok=True
                )

                print(
                    f"✓ features/{module}/{folder}"
                )


            self.render(
                "features/index.ts.j2",
                self.root.parent
                / "app"
                / "src"
                / "features"
                / module
                / "index.ts",
                module=module
            )

            print(
                f"✓ features/{module}/index.ts"
            )