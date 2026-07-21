from generators.base.template_generator import TemplateGenerator


class PdfGenerator(TemplateGenerator):

    def generate(self):

        self.render(
            "documents/pdf-service.ts.j2",
            self.root.parent
            / "app"
            / "src"
            / "services"
            / "pdf.service.ts"
        )

        print(
            "✓ services/pdf.service.ts"
        )