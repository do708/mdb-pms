from core.generator import Generator
from core.template_engine import TemplateEngine
from core.file_writer import FileWriter


class TemplateGenerator(Generator):

    def render(
        self,
        template,
        destination,
        **context
    ):

        engine = TemplateEngine(
            self.root / "templates"
        )

        output = engine.render(
            template,
            **context
        )

        FileWriter.write(
            destination,
            output
        )