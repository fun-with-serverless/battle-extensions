# Battle of the Extensions

## Description
"Battle of the Extensions" delves into the capabilities of Low Latency Runtime (LLRT) in optimizing AWS Lambda functions and extensions, with a focus on scenarios that demand minimal cold start times and maximized performance efficiency. This project sets LLRT against conventional runtimes, using Rust as a comparative benchmark, to showcase the advantages and performance gains achievable in serverless computing frameworks.

For comprehensive details, please see the full blog post.
[link]

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Structure](#structure)
- [Contributing](#contributing)
- [License](#license)

## Installation
This repository is equipped with a `.devcontainer` configuration file for installing necessary dependencies. If you choose not to utilize `.devcontainer`, ensure the following are installed on your system:
* Python 3.11
* The most recent version of Rust
* NodeJS 20.X
* AWS SAM
* AWS CLI

### Deploying Extensions
Execute `make build-all-extensions` to compile both the Rust and LLRT extensions and then upload them to AWS. Upon successful upload, you will receive the ARNs of the layers; note these down for use in deploying the application.

### Deploying the Application
For initial setup, run `make configure-app` to build, configure, and deploy the application that leverages the extensions. During this configuration phase, you will need to enter the layer versions obtained in the previous step.

For subsequent deployments, `make deploy-app` can be used for deploying without reconfiguration.

## Structure
The repository consists of three primary components:
* **The Application**: Comprises several Lambdas that utilize the extensions.
* **The LLRT Extension**: Encapsulates the LLRT runtime, which accepts HTTP requests and forwards the payload to an SQS queue for further processing. For additional details on how the extension is constructed, please refer to the blog.
* **The Rust Extension**: Functions identically to the LLRT extension but is developed in Rust. For more information on its construction, refer to the [YouTube video](https://youtu.be/Mdh_2PXe9i8?si=jgaOEcgL-FXn49iq&t=2158).