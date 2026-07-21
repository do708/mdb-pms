from generators.base.template_generator import TemplateGenerator


class NextGenerator(TemplateGenerator):

    def generate(self):

        files = [

            (
                "next/layout.tsx.j2",
                self.root.parent
                / "app"
                / "src"
                / "app"
                / "layout.tsx"
            ),

            (
                "next/page.tsx.j2",
                self.root.parent
                / "app"
                / "src"
                / "app"
                / "page.tsx"
            ),

            (
                "next/globals.css.j2",
                self.root.parent
                / "app"
                / "src"
                / "app"
                / "globals.css"
            ),

        ]


        for template, destination in files:

            self.render(
                template,
                destination,
                project=self.manifest["project"]
            )

            print(f"✓ {destination.name}")