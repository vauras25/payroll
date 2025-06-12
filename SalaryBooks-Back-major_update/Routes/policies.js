const express = require('express')
const mongo = require('mongoose')
const app = express.Router()
const db = global.db
const User = require('../models/user')
const Policy = require('../models/policy')
const fs = require('fs')
const defaultTags = []
const defaultCategories = ['Operations', 'Technology', 'Marketing', 'HR for Employees', 'HR for Managers', 'SOP', 'Accounting', 'Acquisitions', 'Delivery Minds', 'Distribution', 'Film Sales', 'Marketing', 'Onboarding', 'Operations']
const compareArrays = (n, o) => {
    if ((!n || !n instanceof Array) && (!o || !o instanceof Array)) return ({ added: [], removed: [] })
    if ((!n && !n instanceof Array) && (o && o instanceof Array)) return ({ added: [], removed: o instanceof Array ? o : [] })
    if (n && n instanceof Array && (!o || !o instanceof Array)) return ({ added: n instanceof Array ? n : [], removed: [] })
    return ({
        removed: o instanceof Array ? o.reduce((a, b) => {
            if (!n.includes(b)) a.push(b)
            return a
        }, []) : [], added: n instanceof Array ? n.reduce((a, b) => {
            if (!o.includes(b)) a.push(b)
            return a
        }, []) : []
    })
}
const { checkAuth } = require('./users');
app.post('/policies', checkAuth, (req, res) => {
    let { type } = req.body
    let query = { docTypes: type }
    if (req.userType !== 'admin') query.published = true

    Policy.find(query).then(r => {  res.status(200).json({ error: false, policies: r }) }).catch(e => {
        saveError(e)
        return res.status(500).json({ error: true, message: e })
    })
})
app.post('/all-policies', checkAuth, (req, res) => {
    let query = {  }
    if (req.userType !== 'admin') query.published = true
    Policy.find(query).then(r => { res.status(200).json({ error: false, policies: r }) }).catch(e => {
        saveError(e)
        return res.status(500).json({ error: true, message: e })
    })
})
app.post('/taglist', (req, res) => {
    let { type } = req.body
    Policy.find({ docTypes: type }).select({ tags: 1, _id: 0 }).then(these => {
        let names = [...these, { tags: defaultTags }].reduce((allTags, t) => {
            let { tags } = t
            if (tags) {
                for (let i = 0; i < tags.length; i++) {
                    let c = false
                    for (let z = 0; z < allTags.length; z++) {
                        if (allTags[z].tag === tags[i]) {
                            allTags[z].count++
                            c = true
                            i = allTags.length
                        }
                    }
                    if (!c) allTags.push({ tag: tags[i], count: defaultTags.includes(tags[i]) ? 0 : 1 })
                }
            }
            return allTags
        }, [])
        return res.status(200).json({
            error: false, tags: names.map(u => u.tag).filter(u => u)
        })
    }).catch(e => res.status(500).json({ error: true, message: e }))
})
app.post('/categories', (req, res) => {
    let { type } = req.body
    console.log(type)
    Policy.find({ docTypes: type }).select({ category: 1, _id: 0 }).then(these => {
        console.log(these)
        let names = [...these, ...[...defaultCategories].map(u => ({ category: u }))].reduce((allTags, t) => {
            if (!allTags.includes(t.category)) allTags.push(t.category)
            return allTags
        }, []).sort((a,b) =>  a.toLowerCase() > b.toLowerCase() ? 1 : b.toLowerCase() > a.toLowerCase() ? -1 : 0)
        return res.status(200).json({
            error: false, categories: names.filter(u => u)
        })
    }).catch(e => res.status(500).json({ error: true, message: e }))
})
app.post('/save-policy', (req, res) => {
    if (!req.body.policy) return res.status(500).json({ error: true, message: 'Missing Policy' })
    let { _id, content, name, draft, draftContent, published, tags, category, docTypes } = req.body.policy
    if (!name && !content) return res.status(500).json({ error: true, message: 'Missing name and content' })
    let id = _id
    if (id) {
        Policy.findOne({ _id: id }).then(policy => {
            if (policy) {
                if (name) policy.name = name
                if (content) policy.content = content
                if (typeof published === 'boolean') policy.published = published
                if (typeof draft === 'boolean') policy.draft = draft
                if (draftContent) policy.draftContent = draftContent
                if (tags && policy.tags) {
                    const { added, removed } = compareArrays(policy.tags, tags)
                    added.forEach(add => policy.tags.push(add))
                    removed.forEach(rem => policy.tags.pull(rem))
                } else if (tags) {
                    policy.tags = tags
                }
                if (category) policy.category = category
                if (docTypes && policy.docTypes) {
                    const { added, removed } = compareArrays(docTypes, policy.docTypes)
                    added.forEach(add => policy.docTypes.push(add))
                    removed.forEach(rem => policy.docTypes.pull(rem))
                } else if (docTypes) {
                    policy.docTypes = docTypes
                }

                policy.modified = new Date()
                policy.save().then(z => {
                    res.status(200).json({ error: false, policy: z })
                }).catch(e => {
                    console.log(e)
                    return res.status(500).json({ error: true, message: 'db ERROR' })
                })
            } else {
                return res.status(500).json({ error: true, message: 'Unable to locate policy: ' + id })
            }
        }).catch(e => {
            console.log(e)
            return res.status(500).json({ error: true, message: e })
        })
    } else {
        let policy = { _id: new mongo.Types.ObjectId().toHexString(), creator: req.cookies['userid'] }
        if (name) policy.name = name
        if (content) policy.content = content
        if (draftContent) policy.draftContent = draftContent
        if (typeof published === 'boolean') policy.published = published
        if (typeof draft === 'boolean') policy.draft = draft
        policy.tags = tags || []
        if (category) policy.category = category
        policy.docTypes = docTypes || ['policy']
        new Policy(policy).save().then(policy => {
            return res.status(200).json({ error: false, policy })
        }).catch(e => {
            console.log(e)
            return res.status(500).json({ error: true, message: 'DB Error' })
        })
    }
})
app.post('/delete-policy', (req, res) => {
    let { _id } = req.body
    Policy.deleteOne({ _id }).then(r => {
        return res.status(200).json({ error: false, r })
    }).catch(e => {
        console.log(e)
        return res.status(500).json({ error: true, message: 'DB Error' })
    })
})
module.exports = app