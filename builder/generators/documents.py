from generators.base.template_generator import TemplateGenerator


class DocumentsGenerator(TemplateGenerator):

    def generate(self):

        self.render(
            "documents/page.tsx.j2",
            self.root.parent
            / "app"
            / "src"
            / "app"
            / "documents"
            / "page.tsx",
            project=self.manifest["project"]
        )

        print("✓ documents/page.tsx")