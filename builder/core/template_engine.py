from pathlib import Path
from jinja2 import Environment, FileSystemLoader


class TemplateEngine:

    def __init__(self, template_path: Path):
        self.environment = Environment(
            loader=FileSystemLoader(template_path),
            trim_blocks=True,
            lstrip_blocks=True,
        )

    def render(
        self,
        template: str,
        **context
    ) -> str:

        file = self.environment.get_template(template)

        return file.render(**context)