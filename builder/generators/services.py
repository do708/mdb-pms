from generators.base.template_generator import TemplateGenerator


class ServicesGenerator(TemplateGenerator):

    def generate(self):

        services = [

            "customer",
            "project",
            "workorder",
            "document",
            "user",

        ]


        for service in services:

            self.render(
                "services/service.ts.j2",
                self.root.parent
                / "app"
                / "src"
                / "services"
                / f"{service}.service.ts",
                resource=service
            )

            print(f"✓ services/{service}.service.ts")