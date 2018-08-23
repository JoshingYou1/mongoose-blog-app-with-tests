"use strict";

const chai = require("chai");
const chaiHttp = require("chaiHttp");
const faker = require("faker");
const mongoose = require("mongoose");

const expect = chai.expect;

const {BlogPost} = require("../models");
const {TEST_DATABASE_URL} = require("../config");
const {app, runServer, closeServer} = require("../server");

chai.use(chaiHttp);

function generateBlogPostTitle() {
    const titles = ["How to Find Happiness", "Getting Smart With: JavaScript", "How to CSS the Right Way", "10 Tips for Becoming" +
    "a Software Developer", "How to Make a Strong Software Development Portfolio"];
    return titles[Math.floor(Math.random() * titles.length)];
}

function generateBlogPostData() {
    return {
        author: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName()
        },
        content: faker.lorem.paragraph(),
        title: generateBlogPostTitle(),
        created: faker.date.recent()
    }
}

function seedBlogPostData() {
    console.info("Seeding blog post data");
    const seedData = [];
    for (let i = 0; i < 5; i++) {
        seedData.push(generateBlogPostData());
    }
    return  BlogPost.insertMany(seedData);
}

function tearDownDb() {
    console.warn("Deleting current database");
    return mongoose.connection.dropDatabase();
}

describe("Blog post API resource", function() {
    before(function() {
        return runServer(TEST_DATABASE_URL);
    });

    beforeEach(function() {
        return seedBlogPostData();
    });

    afterEach(function() {
        return tearDownDb();
    });

    after(function() {
        return closeServer();
    });

    describe("GET endpoint for blog posts", function() {
        it("Should retrieve all existing blog posts", function() {
            let res;

            return chai.request(app)
                .get("/posts")
                .then(function(_res) {
                    res = _res;
                    expect(res).to.have.status(200);
                    expect(res.body.posts).to.have.lengthOf.at.least(1);
                    return BlogPost.count();
                })
                .then(function(count) {
                    expect(res.body.posts).to.have.lengthOf(count);
                })
        });
    });

    it("Should return blog posts with the correct fields", function() {
        let resBlogPost;
        return chai.request(app)
            .get("/posts")
            .then(function(res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body.posts).to.be.a("array")
                expect(res.body.posts).to.have.lengthOf.at.least(1);

                res.body.posts.forEach(function(post) {
                    expect(post).to.be.a("object");
                    expect(post).to.include.keys("id", "author", "content", "title", "created");
                });
                resBlogPost = res.body.posts[0];
                return BlogPost.findById(resBlogPost.id)
            })
            .then(function(post) {
                expect(resBlogPost.id).to.equal(post.id);
                expect(resBlogPost.author).to.equal(post.author);
                expect(resBlogPost.content).to.equal(post.content);
                expect(resBlogPost.title).to.equal(post.title);
                expect(resBlogPost.created).to.equal(post.created);
            });
    });
});

