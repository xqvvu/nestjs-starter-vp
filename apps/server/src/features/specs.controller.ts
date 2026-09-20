import { Controller, Get, Header } from "@nestjs/common";

import { generateOpenAPISpec, scalarDocument } from "@/lib/openapi";

@Controller()
export class SpecsController {
  @Get("specs.json")
  async specs() {
    return generateOpenAPISpec();
  }

  @Get("specs")
  @Header("content-type", "text/html; charset=utf-8")
  reference() {
    return scalarDocument;
  }
}
