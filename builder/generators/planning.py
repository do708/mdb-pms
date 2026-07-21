from generators.base.template_generator import TemplateGenerator


class PlanningGenerator(TemplateGenerator):

    def generate(self):

        self.render(
            "planning/page.tsx.j2",
            self.root.parent
            / "app"
            / "src"
            / "app"
            / "planning"
            / "page.tsx",
            project=self.manifest["project"]
        )

        print("✓ planning/page.tsx")