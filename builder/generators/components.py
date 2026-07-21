from generators.base.template_generator import TemplateGenerator


class ComponentsGenerator(TemplateGenerator):

    def generate(self):

        components = [

            "Button",
            "Card",
            "Table",
            "Modal",
            "Input",
            "Select",
            "Badge",

        ]


        for component in components:

            self.render(
                "components/component.tsx.j2",
                self.root.parent
                / "app"
                / "src"
                / "components"
                / "ui"
                / f"{component}.tsx",
                component=component
            )

            print(
                f"✓ components/ui/{component}.tsx"
            )