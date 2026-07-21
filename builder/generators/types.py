from generators.base.template_generator import TemplateGenerator


class TypesGenerator(TemplateGenerator):

    def generate(self):

        types = [

            "customer",
            "project",
            "workorder",
            "material",
            "document",
            "user",
            "planning",

        ]


        for item in types:

            self.render(
                "types/type.ts.j2",
                self.root.parent
                / "app"
                / "src"
                / "types"
                / f"{item}.ts",
                item=item
            )

            print(
                f"✓ types/{item}.ts"
            )