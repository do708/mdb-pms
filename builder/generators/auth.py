from generators.base.template_generator import TemplateGenerator


class AuthGenerator(TemplateGenerator):

    def generate(self):

        files = [

            (
                "auth/auth.ts.j2",
                self.root.parent
                / "app"
                / "src"
                / "auth.ts"
            ),

            (
                "auth/middleware.ts.j2",
                self.root.parent
                / "app"
                / "src"
                / "middleware.ts"
            ),

        ]


        for template, destination in files:

            self.render(
                template,
                destination,
                project=self.manifest["project"]
            )

            print(f"✓ {destination.name}")