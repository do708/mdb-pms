from generators.base.template_generator import TemplateGenerator


class UtilsGenerator(TemplateGenerator):

    def generate(self):

        utils = [

            "format",
            "date",
            "number",
            "validation",

        ]


        for util in utils:

            self.render(
                "utils/util.ts.j2",
                self.root.parent
                / "app"
                / "src"
                / "utils"
                / f"{util}.ts",
                util=util
            )

            print(
                f"✓ utils/{util}.ts"
            )