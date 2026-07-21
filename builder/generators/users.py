from generators.base.template_generator import TemplateGenerator


class UsersGenerator(TemplateGenerator):

    def generate(self):

        self.render(
            "users/page.tsx.j2",
            self.root.parent
            / "app"
            / "src"
            / "app"
            / "users"
            / "page.tsx",
            project=self.manifest["project"]
        )

        print("✓ users/page.tsx")