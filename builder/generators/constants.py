from generators.base.template_generator import TemplateGenerator


class ConstantsGenerator(TemplateGenerator):

    def generate(self):

        constants = [

            "routes",
            "roles",
            "statuses",
            "permissions",

        ]


        for constant in constants:

            self.render(
                "constants/constant.ts.j2",
                self.root.parent
                / "app"
                / "src"
                / "constants"
                / f"{constant}.ts",
                constant=constant
            )

            print(
                f"✓ constants/{constant}.ts"
            )