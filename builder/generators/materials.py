from generators.base.template_generator import TemplateGenerator


class MaterialsGenerator(TemplateGenerator):

    def generate(self):

        self.render(
            "materials/page.tsx.j2",
            self.root.parent
            / "app"
            / "src"
            / "app"
            / "materials"
            / "page.tsx",
            project=self.manifest["project"]
        )

        print("✓ materials/page.tsx")