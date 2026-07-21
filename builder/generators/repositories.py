from generators.base.template_generator import TemplateGenerator


class RepositoriesGenerator(TemplateGenerator):

    def generate(self):

        repositories = [

            "customer",
            "project",
            "workorder",
            "document",
            "user",

        ]


        for repository in repositories:

            self.render(
                "repositories/repository.ts.j2",
                self.root.parent
                / "app"
                / "src"
                / "repositories"
                / f"{repository}.repository.ts",
                resource=repository
            )

            print(
                f"✓ repositories/{repository}.repository.ts"
            )