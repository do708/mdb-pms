from generators.base.template_generator import TemplateGenerator


class ProjectsGenerator(TemplateGenerator):

    def generate(self):

        self.render(
            "projects/page.tsx.j2",
            self.root.parent
            / "app"
            / "src"
            / "app"
            / "projects"
            / "page.tsx",
            project=self.manifest["project"]
        )

        print("✓ projects/page.tsx")