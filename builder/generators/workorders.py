from generators.base.template_generator import TemplateGenerator


class WorkordersGenerator(TemplateGenerator):

    def generate(self):

        self.render(
            "workorders/page.tsx.j2",
            self.root.parent
            / "app"
            / "src"
            / "app"
            / "workorders"
            / "page.tsx",
            project=self.manifest["project"]
        )

        print("✓ workorders/page.tsx")