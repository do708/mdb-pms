from generators.base.template_generator import TemplateGenerator


class ApiGenerator(TemplateGenerator):

    def generate(self):

        routes = [

            "customers",
            "projects",
            "workorders",
            "documents",
            "users",

        ]


        for route in routes:

            self.render(
                "api/route.ts.j2",
                self.root.parent
                / "app"
                / "src"
                / "app"
                / "api"
                / route
                / "route.ts",
                resource=route
            )

            print(f"✓ api/{route}/route.ts")