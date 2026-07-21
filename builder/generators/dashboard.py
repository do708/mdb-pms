from generators.base.template_generator import TemplateGenerator


class DashboardGenerator(TemplateGenerator):

    def generate(self):

        self.render(
            "dashboard/page.tsx.j2",
            self.root.parent
            / "app"
            / "src"
            / "app"
            / "dashboard"
            / "page.tsx",
            project=self.manifest["project"]
        )

        print("✓ dashboard/page.tsx")