from generators.base.template_generator import TemplateGenerator


class ValidationGenerator(TemplateGenerator):

    def generate(self):

        schemas = [

            "customer",
            "project",
            "workorder",
            "material",
            "document",
            "user",

        ]


        for schema in schemas:

            self.render(
                "validation/schema.ts.j2",
                self.root.parent
                / "app"
                / "src"
                / "validation"
                / f"{schema}.schema.ts",
                schema=schema
            )

            print(
                f"✓ validation/{schema}.schema.ts"
            )